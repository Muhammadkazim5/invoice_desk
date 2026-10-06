import { findDuplicate, isDuplicateMatch, normalizeVendorName } from './duplicate-detector';

describe('duplicate-detector', () => {
  describe('normalizeVendorName', () => {
    it('trims whitespace and lowercases', () => {
      expect(normalizeVendorName('  Acme Lumber Co.  ')).toBe('acme lumber co.');
    });
  });

  describe('isDuplicateMatch', () => {
    it('matches when vendor name differs only by case/whitespace and invoice number is identical', () => {
      const candidate = {
        vendorName: '  Riverbend Electrical Contracting  ',
        invoiceNumber: 'INV-1042',
      };
      expect(isDuplicateMatch(candidate, 'riverbend electrical contracting', 'INV-1042')).toBe(
        true,
      );
    });

    it('does not match when invoice numbers differ', () => {
      const candidate = {
        vendorName: 'Riverbend Electrical Contracting',
        invoiceNumber: 'INV-1042',
      };
      expect(isDuplicateMatch(candidate, 'Riverbend Electrical Contracting', 'INV-9999')).toBe(
        false,
      );
    });

    it('does not match when vendor names differ', () => {
      const candidate = {
        vendorName: 'Riverbend Electrical Contracting',
        invoiceNumber: 'INV-1042',
      };
      expect(isDuplicateMatch(candidate, 'Summit Plumbing', 'INV-1042')).toBe(false);
    });

    it('invoice number comparison is case-sensitive / exact', () => {
      const candidate = { vendorName: 'Acme Lumber', invoiceNumber: 'inv-1042' };
      expect(isDuplicateMatch(candidate, 'Acme Lumber', 'INV-1042')).toBe(false);
    });
  });

  describe('findDuplicate', () => {
    const existing = [
      { vendorName: 'Acme Lumber Co.', invoiceNumber: 'INV-1001' },
      { vendorName: 'Riverbend Electrical Contracting', invoiceNumber: 'INV-2050' },
      { vendorName: 'Summit Plumbing', invoiceNumber: 'INV-3010' },
    ];

    it('finds the matching invoice regardless of case/whitespace', () => {
      const match = findDuplicate(existing, '  riverbend electrical contracting ', 'INV-2050');
      expect(match).toBe(existing[1]);
    });

    it('returns undefined when nothing matches', () => {
      expect(findDuplicate(existing, 'Acme Lumber Co.', 'INV-9999')).toBeUndefined();
    });

    it('returns undefined on an empty list', () => {
      expect(findDuplicate([], 'Acme Lumber Co.', 'INV-1001')).toBeUndefined();
    });
  });
});
