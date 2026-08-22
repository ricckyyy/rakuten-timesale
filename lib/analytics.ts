import type { Product } from './types';

export interface AffiliateClickEvent {
  item_id: string;
  item_name: string;
  item_category: string;
  list_name: string;
  index: number;
  value: number;
  currency: 'JPY';
}

export interface SelectItemEvent {
  items: [{
    item_id: string;
    item_name: string;
    item_category: string;
    item_list_name: string;
    index: number;
    price: number;
  }];
  value: number;
  currency: 'JPY';
}

export function buildAffiliateClickEvent(
  product: Product,
  listName = 'products',
  position = 0,
): AffiliateClickEvent {
  return {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category,
    list_name: listName,
    index: position,
    value: product.price,
    currency: 'JPY',
  };
}

export function buildSelectItemEvent(
  product: Product,
  listName = 'products',
  position = 0,
): SelectItemEvent {
  return {
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      item_list_name: listName,
      index: position,
      price: product.price,
    }],
    value: product.price,
    currency: 'JPY',
  };
}
