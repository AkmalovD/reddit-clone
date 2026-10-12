import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimit } from '../common/decorators/rate-limit.decorator';
import { ImproveTextDto } from './dto/improve-text.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('improve')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RateLimit({ limit: 10, windowSeconds: 60 })
  @ApiOperation({ summary: 'Улучшить текст поста' })
  @ApiResponse({ status: 200, description: '{ text }' })
  @ApiResponse({
    status: 503,
    description: 'Gemini недоступен или исчерпана квота',
  })
  improve(@Body() dto: ImproveTextDto) {
    return this.ai.improve(dto.text);
  }
}
