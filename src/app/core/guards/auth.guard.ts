import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  // Auth désactivée : on autorise tout.
  canActivate(): boolean {
    return true;
  }
}


@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {
  // Auth désactivée : on autorise tout.
  canActivate(): boolean {
    return true;
  }
}

