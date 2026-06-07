import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🌍 Configuración de CORS si es necesario
  app.enableCors();

  // 🧪 ValidationPipe estricto para class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 📝 Configuración de Swagger (Ecosistema OpenAPI)
  const config = new DocumentBuilder()
    .setTitle('Twitter Clone API')
    .setDescription('Documentación oficial del backend para el reto técnico de Twitter Clone')
    .setVersion('1.0')
    .addBearerAuth() // 🔒 Habilita el botón de candado para los JWT en la UI
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // 👈 Esto levanta la UI en http://localhost:3000/api

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Servidor corriendo en: http://localhost:${port}`);
  console.log(`📝 Swagger documentando en: http://localhost:${port}/api`);
}
bootstrap();