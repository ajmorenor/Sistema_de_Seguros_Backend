import { Test, TestingModule } from '@nestjs/testing';
import { RoleType, StatusType } from 'src/shared/system/domain/system.interface';
import { UserCreateHandler } from './user-create.handler';
import { UuidRepository } from 'src/shared/uuid/domain/uuid.repository';
import { BcryptRepository } from 'src/shared/bcrypt/domain/bcrypt.repository';
import { UserRepository } from 'src/contexts/users/domain/repositories';
import { UserCreateCommand } from './user-create.command';
import { UserConflictEmailException } from 'src/contexts/users/domain/exceptions';
import { User } from 'src/contexts/users/domain/user';

describe('UserCreateHandler', () => {
  let handler: UserCreateHandler;
  let uuidRepository: UuidRepository;
  let bcryptRepository: BcryptRepository;
  let userRepository: UserRepository;

  const mockUuidRepository = {
    generateUuid: jest.fn(),
  };

  const mockBcryptRepository = {
    hash: jest.fn(),
  };

  const mockUserRepository = {
    existByEmail: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCreateHandler,
        { provide: UuidRepository, useValue: mockUuidRepository },
        { provide: BcryptRepository, useValue: mockBcryptRepository },
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    handler = module.get<UserCreateHandler>(UserCreateHandler);
    uuidRepository = module.get<UuidRepository>(UuidRepository);
    bcryptRepository = module.get<BcryptRepository>(BcryptRepository);
    userRepository = module.get<UserRepository>(UserRepository);

    jest.clearAllMocks();
  });

  it('should create a user successfully', async () => {
    // Valid phone: 1234567890 (starts with non-zero)
    const command = new UserCreateCommand(
      'John', 'Doe', 'Smith', 'Wesson', new Date(), '1234567890', 'john@example.com', 'password123', RoleType.ADMIN, StatusType.ACTIVE
    );

    const generatedUuid = 'd9422a84-0988-4674-8975-298055695029'; // valid v4 uuid
    const hashedPassword = 'hashed-password';

    // Ensure mocks return what is expected
    mockUuidRepository.generateUuid.mockReturnValue(generatedUuid);
    mockBcryptRepository.hash.mockResolvedValue(hashedPassword);
    mockUserRepository.existByEmail.mockResolvedValue(false);

    // The handler calls User.create() internally.
    // The mocked create method should return a User object (or similar).
    // Constructing a real User object is best to ensure interface matches.
    const userInstance = User.create({
      _id: generatedUuid,
      firstName: command.firstName,
      secondName: command.secondName,
      firstSurname: command.firstSurname,
      secondSurname: command.secondSurname,
      birthday: command.birthday,
      phone: command.phone,
      email: command.email,
      password: hashedPassword,
      role: command.role,
      status: command.status,
    });
    mockUserRepository.create.mockResolvedValue(userInstance);

    const result = await handler.execute(command);

    expect(uuidRepository.generateUuid).toHaveBeenCalled();
    expect(bcryptRepository.hash).toHaveBeenCalledWith(command.password);
    expect(userRepository.existByEmail).toHaveBeenCalledWith(expect.objectContaining({ _value: command.email }));
    expect(userRepository.create).toHaveBeenCalled();
    expect(result).toHaveProperty('_id', generatedUuid);
    expect(result.email).toBe(command.email);
  });

  it('should throw UserConflictEmailException if email already exists', async () => {
    // Valid phone must be used to pass validation before reaching repository check
    const command = new UserCreateCommand(
      'Jane', 'Doe', 'Smith', 'Wesson', new Date(), '1234567890', 'jane@example.com', 'password123', RoleType.USER, StatusType.ACTIVE
    );

    const generatedUuid = 'd9422a84-0988-4674-8975-298055695029'; // valid v4 uuid
    const hashedPassword = 'hashed-password-2';

    mockUuidRepository.generateUuid.mockReturnValue(generatedUuid);
    mockBcryptRepository.hash.mockResolvedValue(hashedPassword);
    mockUserRepository.existByEmail.mockResolvedValue(true);

    await expect(handler.execute(command)).rejects.toThrow(UserConflictEmailException);

    expect(userRepository.existByEmail).toHaveBeenCalledWith(expect.objectContaining({ _value: command.email }));
    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
