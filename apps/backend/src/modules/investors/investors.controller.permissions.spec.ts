import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards';
import { InvestorsController } from './investors.controller';

function rolesFor(method: keyof InvestorsController) {
  return Reflect.getMetadata(ROLES_KEY, InvestorsController.prototype[method]);
}

test('protects investor write operations as admin-only', () => {
  expect(rolesFor('create')).toEqual(['ADMIN']);
  expect(rolesFor('update')).toEqual(['ADMIN']);
  expect(rolesFor('remove')).toEqual(['ADMIN']);
});

test('allows collectors to read investors', () => {
  expect(rolesFor('findAll')).toEqual(['ADMIN', 'COLLECTOR']);
  expect(rolesFor('findOne')).toEqual(['ADMIN', 'COLLECTOR']);
});

test('uses the roles guard for investor routes', () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, InvestorsController);
  expect(guards).toContain(RolesGuard);
});
