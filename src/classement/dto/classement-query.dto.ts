import { Matches } from 'class-validator';

export class ClassementQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'du doit être au format AAAA-MM-JJ.',
  })
  du: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'au doit être au format AAAA-MM-JJ.',
  })
  au: string;
}
