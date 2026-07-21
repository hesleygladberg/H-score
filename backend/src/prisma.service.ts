import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isMock = false;

  async onModuleInit() {
    try {
      this.logger.log('Conectando ao banco de dados PostgreSQL...');
      // Tentar conectar rodando uma consulta simples
      await this.$connect();
      
      // Executar uma query simples para testar a conexão real
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Banco de dados PostgreSQL conectado com sucesso.');
    } catch (error) {
      this.isMock = true;
      this.logger.warn(
        'Falha ao conectar ao banco de dados PostgreSQL real. Entrando em MODO MOCK (Banco de dados em memória temporário).'
      );
      this.logger.warn(`Detalhe do erro: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    if (!this.isMock) {
      await this.$disconnect();
    }
  }
}
