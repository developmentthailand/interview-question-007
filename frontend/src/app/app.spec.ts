import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { appConfig } from './app.config';

const validCode = 'ABCDE-12345-FGHIJ-67890-KLMNO-54321';

describe('QR product catalog', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App], providers: [...(appConfig.providers ?? []), provideHttpClientTesting()] }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
  });

  it('formats and stores a 30-character product code', () => {
    const { fixture, root, http } = createPage();
    http.expectOne('/api/products').flush([]);
    setInput(root, 'code', 'abcde12345fghij67890klmno54321');
    fixture.detectChanges();

    expect(root.querySelector<HTMLInputElement>('#code')?.value).toBe(validCode);
    expect(root.querySelector<HTMLButtonElement>('.add-button')?.disabled).toBe(false);
    clickButton(root, 'Add');

    const request = http.expectOne('/api/products');
    expect(request.request.body).toEqual({ code: validCode });
    request.flush({ id: 19, code: validCode, createdAtUtc: '2026-10-20T00:00:00Z' });
    fixture.detectChanges();
    expect(root.querySelector('[data-product-id="19"]')?.textContent).toContain(validCode);
  });

  it('shows a QR modal containing a scannable SVG data image', async () => {
    const { fixture, root, http } = createPage();
    http.expectOne('/api/products').flush([{ id: 19, code: validCode, createdAtUtc: '2026-10-20T00:00:00Z' }]);
    fixture.detectChanges();
    clickButton(root, 'QR');
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      const source = root.querySelector<HTMLImageElement>('.qr-image')?.getAttribute('src') ?? '';
      expect(source.startsWith('data:image/svg+xml')).toBe(true);
    });

    expect(root.querySelector('[role="dialog"]')?.textContent).toContain(validCode);
    expect(root.querySelector<HTMLImageElement>('.qr-image')?.alt).toContain(validCode);
    clickButton(root, 'Close');
    fixture.detectChanges();
    expect(root.querySelector('[role="dialog"]')?.hasAttribute('hidden')).toBe(true);
  });

  it('keeps the product when delete is not confirmed', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { fixture, root, http } = createPage();
    http.expectOne('/api/products').flush([{ id: 19, code: validCode, createdAtUtc: '2026-10-20T00:00:00Z' }]);
    fixture.detectChanges();
    clickButton(root, 'Delete');

    expect(confirm).toHaveBeenCalledOnce();
    expect(http.match('/api/products/19')).toHaveLength(0);
    expect(root.querySelector('[data-product-id="19"]')).not.toBeNull();
  });

  it('rejects a duplicate product code and keeps the existing entry', () => {
    const { fixture, root, http } = createPage();
    http.expectOne('/api/products').flush([{ id: 19, code: validCode, createdAtUtc: '2026-10-20T00:00:00Z' }]);
    fixture.detectChanges();
    setInput(root, 'code', validCode);
    fixture.detectChanges();
    clickButton(root, 'Add');
    http.expectOne('/api/products').flush({ title: 'This product code already exists.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(root.querySelectorAll('[data-product-id]').length).toBe(1);
    expect(root.textContent).toContain('Could not add this product');
    expect(root.querySelector<HTMLInputElement>('#code')?.value).toBe(validCode);
  });
});

function createPage(): { fixture: ReturnType<typeof TestBed.createComponent<App>>; root: HTMLElement; http: HttpTestingController } {
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  return { fixture, root: fixture.nativeElement as HTMLElement, http: TestBed.inject(HttpTestingController) };
}

function setInput(root: HTMLElement, id: string, value: string): void {
  const input = root.querySelector<HTMLInputElement>(`#${id}`);
  if (!input) throw new Error(`Input #${id} was not rendered.`);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function clickButton(root: HTMLElement, label: string): void {
  const button = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((candidate) => candidate.textContent?.includes(label));
  if (!button) throw new Error(`Button "${label}" was not rendered.`);
  button.click();
}
