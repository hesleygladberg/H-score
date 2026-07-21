import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para permitir requisições do Next.js (que roda no 3000)
  app.enableCors({
    origin: '*', // Em produção, colocar a origem do frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Backend do Football Analytics Pro iniciado na porta ${port}`);
}
bootstrap();
