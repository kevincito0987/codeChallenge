import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service'; // 🟢 Ajusta la ruta real a tu UsersService

// Mock de la estrategia para evitar que Passport intente inicializar extractores reales
jest.mock('./jwt.strategy', () => {
  return {
    JwtStrategy: jest.fn().mockImplementation(() => ({
      validate: jest.fn().mockResolvedValue({ id: 'user-id' }),
    })),
  };
});

import { JwtStrategy } from './jwt.strategy';

describe('AuthService', () => {
  let service: AuthService;

  // 1️⃣ Mock de ConfigService
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'mock-secret-key';
      return 'mock-value';
    }),
  };

  // 2️⃣ Mock de JwtService
  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
    verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-id' }),
  };

  // 3️⃣ Mock de PrismaService
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  // 4️⃣ 🟢 SOLUCIÓN: Mock de UsersService que le faltaba a tu constructor
  const mockUsersService = {
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: mockUsersService }, // 🟢 Inyectamos el mock aquí
        { provide: JwtStrategy, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});