import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { InvestmentsController } from './investments.controller';

function rolesFor(method: keyof InvestmentsController) {
  return Reflect.getMetadata(ROLES_KEY, InvestmentsController.prototype[method]);
}

test('limits investor capital changes to admins', () => {
  expect(rolesFor('create')).toEqual(['ADMIN']);
  expect(rolesFor('addCapital')).toEqual(['ADMIN']);
});

test('allows collectors to read investment details', () => {
  expect(rolesFor('listByInvestor')).toEqual(['ADMIN', 'COLLECTOR']);
  expect(rolesFor('findOne')).toEqual(['ADMIN', 'COLLECTOR']);
});
