import { Navigation, INavigation } from "../models/navigation.model";
import { BaseRepository } from "./base.repository";

export class NavigationRepository extends BaseRepository<INavigation> {
  constructor() {
    super(Navigation);
  }
}

export const navigationRepository = new NavigationRepository();
