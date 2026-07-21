import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { MockDataService } from './mock-data.service';
import { PredictionService } from './prediction.service';
import { DutchingService } from './dutching.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    PrismaService,
    MockDataService,
    PredictionService,
    DutchingService
  ],
})
export class AppModule {}
