import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from '@angular/fire/firestore';
import { Edicao } from './edition.model';

/**
 * Remove recursivamente campos `undefined` — Firestore rejeita esse valor,
 * e o modelo `Edicao` tem vários campos opcionais (capaUrl, servicoDestaque,
 * midia etc.) que chegam como `undefined` quando não preenchidos.
 */
export function limparUndefined<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor));
}

export const edicaoConverter: FirestoreDataConverter<Edicao> = {
  toFirestore(edicao: Edicao) {
    const { id, ...resto } = edicao;
    return limparUndefined(resto);
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Edicao {
    const dados = snapshot.data(options);
    return { ...dados, id: snapshot.id } as Edicao;
  },
};
