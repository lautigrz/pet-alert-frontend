import { Component } from '@angular/core';

@Component({
  selector: 'app-example-test',
  imports: [],
  templateUrl: './example-test.html',
  styleUrl: './example-test.css',
  template: `
    <h1>Counter: {{ count }}</h1>

    <button (click)="increment()">+</button>
    <button (click)="decrement()">-</button>
  `
})
export class ExampleTest {
  count = 0;

  increment() {
    this.count++;
  }

  decrement() {
    this.count--;
  }
}
