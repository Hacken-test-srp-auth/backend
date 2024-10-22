import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtService } from '../jwt.service';

interface JwtPayload {
  sub: string; // userId
  iat?: number; // Issued At
  exp?: number; // Expiration Time
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private jwtService: JwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async validate(req: any, payload: JwtPayload): Promise<{ userId: string }> {
    // const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    // const isBlacklisted = await this.jwtService.isBlacklisted(token);
    // if (isBlacklisted) {
    //   throw new UnauthorizedException('Token is blacklisted');
    // }
    return { userId: payload.sub };
  }
}
