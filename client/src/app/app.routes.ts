import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page';
import { MusicPlayer } from './music-player/music-player';
import { AudioFileService } from './audio-file-service/audio-file-service';

export const audioLoadedGuard: CanActivateFn = () => {
  const audioFileService = inject(AudioFileService);
  const router = inject(Router);
  return audioFileService.getFile() !== null ? true : router.createUrlTree(['/']);
};

export const routes: Routes = [
  {
    path: '',
    component: LandingPage,
  },
  {
    path: 'music-player',
    component: MusicPlayer,
    canActivate: [audioLoadedGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
