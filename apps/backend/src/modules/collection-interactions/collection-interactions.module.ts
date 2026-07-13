import { Module } from '@nestjs/common';
import { CollectionInteractionsController } from './collection-interactions.controller';
import { CollectionInteractionsService } from './collection-interactions.service';

@Module({
  controllers: [CollectionInteractionsController],
  providers: [CollectionInteractionsService],
  exports: [CollectionInteractionsService],
})
export class CollectionInteractionsModule {}
