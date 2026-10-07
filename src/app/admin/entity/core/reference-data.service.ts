import { Injectable } from '@angular/core';
import { IndexedDb } from './indexed-db';
import { buildSeed } from './seed-data';
import {
  Entity,
  EntityValue,
  EntityWithCounts,
  RefDataStats,
} from './models';

const DB_NAME = 'hqms-refdata';
const DB_VERSION = 1;
const STORE_ENTITY = 'entity';
const STORE_VALUE = 'entity_value';

/**
 * Reference-data persistence.
 *
 * Backed by IndexedDB today; every method returns a Promise and speaks only in
 * domain models. To move to the Node API later, replace the bodies with
 * HttpClient calls (e.g. `firstValueFrom(this.http.get<Entity[]>('/api/entities'))`)
 * — the method signatures and the components stay unchanged.
 */
@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  private readonly db = new IndexedDb(DB_NAME, DB_VERSION, (db) => {
    if (!db.objectStoreNames.contains(STORE_ENTITY)) {
      db.createObjectStore(STORE_ENTITY, { keyPath: 'entity_id' });
    }
    if (!db.objectStoreNames.contains(STORE_VALUE)) {
      const os = db.createObjectStore(STORE_VALUE, { keyPath: 'entityValueId' });
      os.createIndex('entity_id', 'entity_id', { unique: false });
    }
  });

  /** Resolves once the first-run seed (if any) is complete. */
  private readonly ready: Promise<void> = this.seedIfEmpty();

  private async seedIfEmpty(): Promise<void> {
    const count = await this.db.count(STORE_ENTITY);
    if (count > 0) return;
    const { entities, values } = buildSeed();
    await this.db.bulkPut(STORE_ENTITY, entities);
    await this.db.bulkPut(STORE_VALUE, values);
  }

  // ---------------------------------------------------------------- entities
  async listEntities(): Promise<EntityWithCounts[]> {
    await this.ready;
    const [entities, values] = await Promise.all([
      this.db.getAll<Entity>(STORE_ENTITY),
      this.db.getAll<EntityValue>(STORE_VALUE),
    ]);
    return entities
      .map((e) => {
        const vs = values.filter((v) => v.entity_id === e.entity_id);
        return {
          ...e,
          valueCount: vs.length,
          activeValueCount: vs.filter((v) => v.is_active).length,
          defaultValue: vs.find((v) => v.isDefault)?.displayValue ?? null,
        } as EntityWithCounts;
      })
      .sort(
        (a, b) =>
          a.category_type.localeCompare(b.category_type) ||
          a.display_order - b.display_order ||
          a.entity_name.localeCompare(b.entity_name),
      );
  }

  async getEntity(entity_id: string): Promise<Entity | undefined> {
    await this.ready;
    return this.db.get<Entity>(STORE_ENTITY, entity_id);
  }

  async saveEntity(entity: Entity): Promise<void> {
    await this.ready;
    entity.updatedAt = new Date().toISOString();
    await this.db.put(STORE_ENTITY, entity);
  }

  async createEntity(entity: Omit<Entity, 'entity_id' | 'createdAt'>): Promise<Entity> {
    await this.ready;
    const record: Entity = {
      ...entity,
      entity_id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    await this.db.put(STORE_ENTITY, record);
    return record;
  }

  async deleteEntity(entity_id: string): Promise<void> {
    await this.ready;
    const values = await this.db.getAllByIndex<EntityValue>(STORE_VALUE, 'entity_id', entity_id);
    await Promise.all(values.map((v) => this.db.delete(STORE_VALUE, v.entityValueId)));
    await this.db.delete(STORE_ENTITY, entity_id);
  }

  async categories(): Promise<string[]> {
    await this.ready;
    const entities = await this.db.getAll<Entity>(STORE_ENTITY);
    return Array.from(new Set(entities.map((e) => e.category_type))).sort();
  }

  // ------------------------------------------------------------------ values
  async listValues(entity_id: string): Promise<EntityValue[]> {
    await this.ready;
    const values = await this.db.getAllByIndex<EntityValue>(STORE_VALUE, 'entity_id', entity_id);
    return values.sort((a, b) => a.display_order - b.display_order);
  }

  async saveValue(value: EntityValue): Promise<void> {
    await this.ready;
    // Enforce a single default per entity.
    if (value.isDefault) {
      const siblings = await this.db.getAllByIndex<EntityValue>(STORE_VALUE, 'entity_id', value.entity_id);
      await Promise.all(
        siblings
          .filter((s) => s.entityValueId !== value.entityValueId && s.isDefault)
          .map((s) => this.db.put(STORE_VALUE, { ...s, isDefault: false })),
      );
    }
    value.updatedAt = new Date().toISOString();
    await this.db.put(STORE_VALUE, value);
  }

  async createValue(value: Omit<EntityValue, 'entityValueId' | 'createdAt'>): Promise<EntityValue> {
    const record: EntityValue = {
      ...value,
      entityValueId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    await this.saveValue(record);
    return record;
  }

  async deleteValue(entityValueId: string): Promise<void> {
    await this.ready;
    await this.db.delete(STORE_VALUE, entityValueId);
  }

  // ------------------------------------------------------------------- stats
  async getStats(): Promise<RefDataStats> {
    await this.ready;
    const [entities, values] = await Promise.all([
      this.db.getAll<Entity>(STORE_ENTITY),
      this.db.getAll<EntityValue>(STORE_VALUE),
    ]);
    const total = values.length;
    const active = values.filter((v) => v.is_active).length;
    return {
      totalEntities: entities.length,
      totalValues: total,
      systemLocked: entities.filter((e) => e.is_system).length,
      activeValues: active,
      avgPerEntity: entities.length ? +(total / entities.length).toFixed(1) : 0,
      inactiveValues: total - active,
    };
  }

  newId(): string {
    return crypto.randomUUID();
  }
}
