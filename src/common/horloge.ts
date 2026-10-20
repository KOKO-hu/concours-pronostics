import { Injectable } from '@nestjs/common';

@Injectable()
export class Horloge {
  maintenant(): Date {
    return new Date();
  }
}
