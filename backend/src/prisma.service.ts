import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  
  // Por padrão rodamos em modo Mock para garantir execução local imediata sem banco de dados configurado
  public isMock = true;

  // Propriedades mockadas para compilação do TypeScript
  public get league(): any { return null; }
  public get team(): any { return null; }
  public get match(): any { return null; }
  public get standing(): any { return null; }
  public get player(): any { return null; }
  public get lineup(): any { return null; }
  public get teamStats(): any { return null; }
  public get odds(): any { return null; }
  public get prediction(): any { return null; }
  public get correctScore(): any { return null; }
  public get dutching(): any { return null; }
  public get bankroll(): any { return null; }
  public get bankrollHistory(): any { return null; }

  async onModuleInit() {
    this.logger.log('PrismaService iniciado em MODO MOCK (Banco de dados em memória temporário).');
  }

  async onModuleDestroy() {
    // Encerrar mock
  }
}
