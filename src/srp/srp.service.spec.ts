import { Test, TestingModule } from '@nestjs/testing';
import { SrpService } from './srp.service';

describe('SrpService', () => {
  let service: SrpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SrpService],
    }).compile();

    service = module.get<SrpService>(SrpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
