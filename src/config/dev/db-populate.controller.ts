/**
 * Das Modul besteht aus der Controller-Klasse für das Neuladen der DB.
 * @packageDocumentation
 */

import {
    Controller,
    HttpStatus,
    Post,
    Res,
    //UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { DbPopulateService } from './db-populate.service.js';
//import { JwtAuthGuard } from '../../security/auth/jwt/jwt-auth.guard.js';
import { Response } from 'express';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
//import { Roles } from '../../security/auth/roles/roles.decorator.js';
//import { RolesGuard } from '../../security/auth/roles/roles.guard.js';

/**
 * Die Controller-Klasse für das Neuladen der DB.
 */
@Controller('dbPopulate')
//@UseGuards(JwtAuthGuard, RolesGuard)
//@Roles('admin')
@UseInterceptors(ResponseTimeInterceptor)
export class DbPopulateController {
    readonly #service: DbPopulateService;

    constructor(service: DbPopulateService) {
        this.#service = service;
    }

    @Post()
    async dbPopulate(@Res() res: Response): Promise<Response> {
        await this.#service.populateTestdaten();
        return res.sendStatus(HttpStatus.OK);
    }
}
