import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Edition } from './edition';

describe('Edition', () => {
  let component: Edition;
  let fixture: ComponentFixture<Edition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Edition]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Edition);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
