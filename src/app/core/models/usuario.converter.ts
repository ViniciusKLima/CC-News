import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from '@angular/fire/firestore';
import { Usuario } from './usuario.model';
import { limparUndefined } from './edition.converter';

export const usuarioConverter: FirestoreDataConverter<Usuario> = {
  toFirestore(usuario: Usuario) {
    const { id, ...resto } = usuario;
    return limparUndefined(resto);
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Usuario {
    const dados = snapshot.data(options);
    return { ...dados, id: snapshot.id } as Usuario;
  },
};
