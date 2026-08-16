import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./investor-detail-page.tsx', import.meta.url), 'utf8');

test('places capital immediately before monthly interest', () => {
  assert.match(source, /const investmentTableColumns = 'grid-cols-6 gap-6'/);
  const capitalHeader = source.indexOf('>Capital</span>');
  const monthlyInterestHeader = source.indexOf('>Interés mensual</span>');
  const capitalValue = source.indexOf('{fmt(investment.capital)}');
  const monthlyInterestValue = source.indexOf('{fmt(investment.monthlyPayment)}');
  assert.ok(capitalHeader >= 0 && capitalHeader < monthlyInterestHeader);
  assert.ok(capitalValue >= 0 && capitalValue < monthlyInterestValue);
  assert.match(source, /className="overflow-x-auto"/);
  assert.match(source, /min-w-\[1000px\]/);
  assert.doesNotMatch(
    source,
    /justify-items-center|text-right|<span className="text-center">Estado/,
  );
});

test('uses an actions menu instead of a direct register-payment button', () => {
  assert.match(source, /<DropdownMenu\.Trigger asChild>/);
  assert.match(source, />\s*Acciones\s*<ChevronDown/);
  assert.match(source, /<DropdownMenu\.Item asChild>/);
  assert.match(source, />\s*Exportar\s*<\/button>/);
  assert.match(source, /href={`\/inversionistas\/nuevo\?sourceInvestorId=\$\{investorId\}`}/);
  assert.match(source, />\s*Nueva inversión\s*<\/Link>/);
  assert.match(source, /href={`\/inversionistas\/pago\?investmentId=\$\{investments\[0\]\.id\}`}/);
});
