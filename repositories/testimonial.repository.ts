import { Testimonial, ITestimonial } from "../models/testimonial.model";
import { BaseRepository } from "./base.repository";

export class TestimonialRepository extends BaseRepository<ITestimonial> {
  constructor() {
    super(Testimonial);
  }
}

export const testimonialRepository = new TestimonialRepository();
