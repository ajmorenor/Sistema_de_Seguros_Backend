import { UserPrimitive } from 'src/contexts/users/domain/user.interface';

export class UserUpdateIdCommand {
  /**
   * Creates an instance of UserUpdateIdCommand.
   * @date 2025-12-10 07:23:26
   * @author Jogan Ortiz Muñoz
   *
   * @constructor
   * @param {NonNullable<UserPrimitive['_id']>} _id
   */
  constructor(readonly _id: NonNullable<UserPrimitive['_id']>) {}
}
