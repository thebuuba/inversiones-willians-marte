import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards';
import { TasksController } from './tasks.controller';

function rolesFor(method: keyof TasksController) {
  return Reflect.getMetadata(ROLES_KEY, TasksController.prototype[method]);
}

test('limits task deletion to admins', () => {
  expect(rolesFor('remove')).toEqual(['ADMIN']);
});

test('uses the roles guard for task routes', () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, TasksController);
  expect(guards).toContain(RolesGuard);
});
