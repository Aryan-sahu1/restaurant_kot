import { Test, TestingModule } from '@nestjs/testing';
import { KotService } from './kot.service';

describe('KotService', () => {
  let service: KotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KotService],
    }).compile();

    service = module.get<KotService>(KotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
