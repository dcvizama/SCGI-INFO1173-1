import { DESTINOS, resolverApi } from '../config';

const MOCK = 'https://scgi-info1173-1.onrender.com/api';
const TI2 = 'https://backend-ti2.onrender.com/api';

describe('resolverApi (T8: conmutación de baseURL)', () => {
  it('usa el mock por defecto', () => {
    expect(resolverApi({ urlMock: MOCK })).toEqual({
      destino: DESTINOS.MOCK,
      raiz: MOCK,
      respaldo: false,
    });
  });

  it('usa el backend de TI2 cuando el flag es ti2 y su URL existe', () => {
    expect(resolverApi({ destino: 'ti2', urlMock: MOCK, urlTi2: TI2 })).toEqual({
      destino: DESTINOS.TI2,
      raiz: TI2,
      respaldo: false,
    });
  });

  it('vuelve al mock si se pide ti2 sin URL configurada', () => {
    expect(resolverApi({ destino: 'ti2', urlMock: MOCK, urlTi2: '' })).toEqual({
      destino: DESTINOS.MOCK,
      raiz: MOCK,
      respaldo: true,
    });
  });

  it('acepta EXPO_PUBLIC_API_URL del Sprint 1 como URL del mock', () => {
    expect(resolverApi({ urlLegada: MOCK }).raiz).toBe(MOCK);
  });

  it('prefiere EXPO_PUBLIC_API_URL_MOCK sobre la variable antigua', () => {
    expect(resolverApi({ urlMock: MOCK, urlLegada: 'https://otra.com/api' }).raiz).toBe(MOCK);
  });

  it('ignora mayúsculas y espacios en el flag', () => {
    expect(resolverApi({ destino: '  TI2 ', urlTi2: TI2 }).destino).toBe(DESTINOS.TI2);
  });

  it('quita la barra final de la URL', () => {
    expect(resolverApi({ urlMock: `${MOCK}/` }).raiz).toBe(MOCK);
  });

  it('usa el mock si el flag tiene un valor desconocido', () => {
    expect(resolverApi({ destino: 'produccion', urlMock: MOCK })).toEqual({
      destino: DESTINOS.MOCK,
      raiz: MOCK,
      respaldo: true,
    });
  });
});