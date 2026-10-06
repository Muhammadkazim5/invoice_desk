import { InvoiceStatus } from './invoice-status.enum';
import { assertValidStatusTransition, canTransition, isFinalStatus } from './status-transitions';
import { AppException } from '../common/exceptions/app.exception';

describe('status-transitions', () => {
  describe('canTransition', () => {
    it.each([
      [InvoiceStatus.PROCESSING, InvoiceStatus.APPROVED, true],
      [InvoiceStatus.PROCESSING, InvoiceStatus.REJECTED, true],
      [InvoiceStatus.PROCESSING, InvoiceStatus.NEEDS_REVIEW, true],
      [InvoiceStatus.NEEDS_REVIEW, InvoiceStatus.APPROVED, true],
      [InvoiceStatus.NEEDS_REVIEW, InvoiceStatus.REJECTED, true],
      [InvoiceStatus.NEEDS_REVIEW, InvoiceStatus.PROCESSING, false],
      [InvoiceStatus.APPROVED, InvoiceStatus.REJECTED, false],
      [InvoiceStatus.APPROVED, InvoiceStatus.NEEDS_REVIEW, false],
      [InvoiceStatus.REJECTED, InvoiceStatus.APPROVED, false],
    ])('from %s to %s -> %s', (from, to, expected) => {
      expect(canTransition(from, to)).toBe(expected);
    });
  });

  describe('isFinalStatus', () => {
    it('treats approved and rejected as final', () => {
      expect(isFinalStatus(InvoiceStatus.APPROVED)).toBe(true);
      expect(isFinalStatus(InvoiceStatus.REJECTED)).toBe(true);
    });

    it('treats processing and needs_review as non-final', () => {
      expect(isFinalStatus(InvoiceStatus.PROCESSING)).toBe(false);
      expect(isFinalStatus(InvoiceStatus.NEEDS_REVIEW)).toBe(false);
    });
  });

  describe('assertValidStatusTransition', () => {
    it('allows approving without a note', () => {
      expect(() =>
        assertValidStatusTransition(InvoiceStatus.PROCESSING, InvoiceStatus.APPROVED, undefined),
      ).not.toThrow();
    });

    it('allows approving with a note', () => {
      expect(() =>
        assertValidStatusTransition(InvoiceStatus.PROCESSING, InvoiceStatus.APPROVED, 'looks good'),
      ).not.toThrow();
    });

    it('requires a non-empty note to reject', () => {
      expect(() =>
        assertValidStatusTransition(InvoiceStatus.PROCESSING, InvoiceStatus.REJECTED, undefined),
      ).toThrow(AppException);
      expect(() =>
        assertValidStatusTransition(InvoiceStatus.PROCESSING, InvoiceStatus.REJECTED, '   '),
      ).toThrow(AppException);
    });

    it('allows rejecting with a note', () => {
      expect(() =>
        assertValidStatusTransition(InvoiceStatus.PROCESSING, InvoiceStatus.REJECTED, 'bad amount'),
      ).not.toThrow();
    });

    it('rejects (409) a transition out of a final status', () => {
      try {
        assertValidStatusTransition(InvoiceStatus.APPROVED, InvoiceStatus.REJECTED, 'reason');
        fail('expected AppException');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect((error as AppException).getStatus()).toBe(409);
        expect((error as AppException).getResponse()).toMatchObject({ code: 'INVALID_TRANSITION' });
      }
    });

    it('rejects (409) an invalid but non-final transition', () => {
      try {
        assertValidStatusTransition(
          InvoiceStatus.NEEDS_REVIEW,
          InvoiceStatus.PROCESSING,
          undefined,
        );
        fail('expected AppException');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect((error as AppException).getStatus()).toBe(409);
      }
    });

    it('surfaces NOTE_REQUIRED with 400 before checking the transition table', () => {
      try {
        assertValidStatusTransition(InvoiceStatus.APPROVED, InvoiceStatus.REJECTED, undefined);
        fail('expected AppException');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect((error as AppException).getStatus()).toBe(400);
        expect((error as AppException).getResponse()).toMatchObject({ code: 'NOTE_REQUIRED' });
      }
    });
  });
});
