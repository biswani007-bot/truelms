import { HeroSection, IHeroSection } from "../models/hero-section.model";
import { BaseRepository } from "./base.repository";

export class HeroSectionRepository extends BaseRepository<IHeroSection> {
  constructor() {
    super(HeroSection);
  }
}

export const heroSectionRepository = new HeroSectionRepository();
