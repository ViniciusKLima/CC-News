import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from '@angular/fire/firestore';
import { Usuario } from './usuario.model';
import { limparUndefined } from './edition.converter';

// Converte entre o modelo Usuario usado na aplicação e o formato salvo no
// Firestore, seguindo o mesmo padrão do edicaoConverter.
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
