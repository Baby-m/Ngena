import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { AvailabilityService } from './availability.service.js';

@Controller()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // Publico: nao precisa de login
  @Get('events/:eventId/availability')
  findByEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.availabilityService.findByEvent(eventId);
  }
}
