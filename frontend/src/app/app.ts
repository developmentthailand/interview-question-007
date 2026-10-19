import { Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import * as QRCode from 'qrcode';
import { Product, ProductApiService } from './services/product-api.service';

const productCodePattern = /^[A-Z0-9]{5}(?:-[A-Z0-9]{5}){5}$/;

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(ProductApiService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly products = signal<Product[]>([]);
  protected readonly selectedProduct = signal<Product | null>(null);
  protected readonly qrImageUrl = signal<SafeUrl | null>(null);
  protected readonly qrLoading = signal(false);
  protected readonly qrError = signal(false);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(productCodePattern)]],
  });

  constructor() {
    this.loadProducts();
  }

  protected formatCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    const characters = input.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 30);
    input.value = (characters.match(/.{1,5}/g) ?? []).join('-');
    this.form.controls.code.setValue(input.value);
    this.form.controls.code.markAsDirty();
  }

  protected addProduct(): void {
    this.errorMessage.set(null);
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.api
      .create(this.form.controls.code.value)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (product) => {
          this.products.update((current) => [product, ...current]);
          this.form.reset();
        },
        error: () => this.errorMessage.set('Could not add this product. The code may already exist.'),
      });
  }

  protected async openQr(product: Product): Promise<void> {
    this.selectedProduct.set(product);
    this.qrImageUrl.set(null);
    this.qrError.set(false);
    this.qrLoading.set(true);
    try {
      const svg = await QRCode.toString(product.code, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 2,
        color: { dark: '#172921', light: '#ffffff' },
      });
      if (this.selectedProduct()?.id !== product.id) return;
      const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
      this.qrImageUrl.set(this.sanitizer.bypassSecurityTrustUrl(url));
    } catch {
      this.qrError.set(true);
    } finally {
      this.qrLoading.set(false);
    }
  }

  protected closeQr(): void {
    this.selectedProduct.set(null);
    this.qrImageUrl.set(null);
  }

  protected deleteProduct(product: Product): void {
    if (!window.confirm(`Delete product ${product.code}?`)) return;
    this.errorMessage.set(null);
    this.deletingId.set(product.id);
    this.api
      .delete(product.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => this.products.update((current) => current.filter((item) => item.id !== product.id)),
        error: () => this.errorMessage.set('Could not delete this product. Refresh the list and try again.'),
      });
  }

  protected createdLabel(product: Product): string {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(product.createdAtUtc));
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (products) => this.products.set(products),
        error: () => this.errorMessage.set('Could not load products. Refresh to try again.'),
      });
  }
}
