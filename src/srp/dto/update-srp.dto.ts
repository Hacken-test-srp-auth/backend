import { PartialType } from '@nestjs/mapped-types';
import { CreateSrpDto } from './create-srp.dto';

export class UpdateSrpDto extends PartialType(CreateSrpDto) {}
