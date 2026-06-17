import { Component } from '@angular/core';
import {MatRadioModule} from '@angular/material/radio';

@Component({
  selector: 'app-enhanced-seat-preferences',
  standalone: true,
  imports: [MatRadioModule],
  templateUrl: './enhanced-seat-preferences.component.html',
  styleUrl: './enhanced-seat-preferences.component.css'
})
export class EnhancedSeatPreferencesComponent {

}
