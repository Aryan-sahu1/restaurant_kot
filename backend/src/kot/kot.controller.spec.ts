import { Test, TestingModule } from '@nestjs/testing';
import { KotController } from './kot.controller';

describe('KotController', () => {
  let controller: KotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KotController],
    }).compile();

    controller = module.get<KotController>(KotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
