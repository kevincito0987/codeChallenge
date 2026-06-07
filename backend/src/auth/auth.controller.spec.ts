import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  // 🟢 Creamos un mock plano del AuthService con los métodos típicos
  // Si en tu controlador usas métodos con otros nombres (ej: signIn, signUp), agrégalos aquí abajo
  const mockAuthService = {
    login: jest.fn().mockResolvedValue({ accessToken: 'mock-token' }),
    register: jest
      .fn()
      .mockResolvedValue({ id: 'user-id', email: 'test@test.com' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        // 🟢 Le decimos a NestJS que cuando el controlador pida AuthService, use nuestro mock
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
