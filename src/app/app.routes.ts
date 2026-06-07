import { Routes } from '@angular/router';
import { LandingPage} from './landing-page/landing-page';
import {MusicPlayer} from './music-player/music-player';

export const routes: Routes = [
  {
    path: '',
    component: LandingPage,
  },
  {
    path: 'music-player',
    component: MusicPlayer
  }
];
