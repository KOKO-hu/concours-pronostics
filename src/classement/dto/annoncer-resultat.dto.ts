import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AnnoncerResultatDto {
  @Type(() => Number)
  @IsInt({ message: 'buts_domicile doit être un entier.' })
  @Min(0, { message: 'buts_domicile ne peut pas être négatif.' })
  buts_domicile: number;

  @Type(() => Number)
  @IsInt({ message: 'buts_exterieur doit être un entier.' })
  @Min(0, { message: 'buts_exterieur ne peut pas être négatif.' })
  buts_exterieur: number;
}
