import mongoose, { Model, Document, ClientSession, PopulateOptions } from "mongoose";
import { QueryHelper } from "../helpers/query";
import { PaginationInput } from "../dtos/pagination.dto";

export interface IRepositoryOptions {
  session?: ClientSession;
  populate?: string | PopulateOptions | (string | PopulateOptions)[];
  select?: string | Record<string, number>;
  lean?: boolean;
  sort?: string | Record<string, any>;
}

export abstract class BaseRepository<T extends Document<mongoose.Types.ObjectId>> {
  protected constructor(protected readonly model: Model<T>) {}

  async findById(id: string, options: IRepositoryOptions = {}): Promise<T | null> {
    let query: any = this.model.findById(id);

    if (options.populate) query = query.populate(options.populate as any);
    if (options.select) query = query.select(options.select);
    if (options.lean !== false) query = query.lean() as any;
    if (options.session) query = query.session(options.session);

    return query.exec();
  }

  async findOne(
    filter: Record<string, any>,
    options: IRepositoryOptions = {}
  ): Promise<T | null> {
    let query: any = this.model.findOne({ ...filter, isDeleted: false });

    if (options.populate) query = query.populate(options.populate as any);
    if (options.select) query = query.select(options.select);
    if (options.lean !== false) query = query.lean() as any;
    if (options.session) query = query.session(options.session);

    return query.exec();
  }

  async findMany(
    filter: Record<string, any> = {},
    options: IRepositoryOptions = {}
  ): Promise<T[]> {
    let query: any = this.model.find({ ...filter, isDeleted: false });

    if (options.sort) query = query.sort(options.sort);
    if (options.populate) query = query.populate(options.populate as any);
    if (options.select) query = query.select(options.select);
    if (options.lean !== false) query = query.lean() as any;
    if (options.session) query = query.session(options.session);

    return query.exec();
  }

  async create(data: Partial<T>, options: { session?: ClientSession } = {}): Promise<T> {
    const doc = new this.model(data);
    if (options.session) {
      await doc.save({ session: options.session });
    } else {
      await doc.save();
    }
    return doc;
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    return this.model.countDocuments({ ...filter, isDeleted: false }).exec();
  }

  async update(
    id: string,
    data: Partial<T>,
    options: IRepositoryOptions = {}
  ): Promise<T | null> {
    let query: any = this.model.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (options.populate) query = query.populate(options.populate as any);
    if (options.select) query = query.select(options.select);
    if (options.lean !== false) query = query.lean() as any;
    if (options.session) query = query.session(options.session);

    return query.exec();
  }

  async softDelete(id: string, options: { session?: ClientSession } = {}): Promise<T | null> {
    const data: any = { isDeleted: true, deletedAt: new Date(), status: "ARCHIVED" };
    return this.update(id, data, { ...options, lean: false });
  }

  async restore(id: string, options: { session?: ClientSession } = {}): Promise<T | null> {
    const data: any = { isDeleted: false, deletedAt: undefined, status: "ACTIVE" };
    return this.update(id, data, { ...options, lean: false });
  }

  async paginate(
    paginationInput: PaginationInput,
    searchableFields: string[] = [],
    options: IRepositoryOptions = {}
  ): Promise<{ data: T[]; meta: any }> {
    const filters = QueryHelper.buildFilters(paginationInput, searchableFields);
    const sort = QueryHelper.buildSort(paginationInput);
    const page = paginationInput.page;
    const limit = paginationInput.limit;
    const skip = (page - 1) * limit;

    const total = await this.model.countDocuments(filters).session(options.session || null as any);

    let query: any = this.model
      .find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    if (options.populate) query = query.populate(options.populate as any);
    if (options.select) query = query.select(options.select);
    if (options.lean !== false) query = query.lean() as any;
    if (options.session) query = query.session(options.session);

    const data = await query.exec();
    const meta = QueryHelper.buildMeta(total, page, limit);

    return { data, meta };
  }
}
