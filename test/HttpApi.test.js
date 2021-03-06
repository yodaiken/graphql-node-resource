/** @flow */

import mockedFetch from 'node-fetch';
import { HttpApi, HttpError } from '../src';

import { TestHttpApi } from './helpers';

describe('HttpApi', () => {
  afterEach(() => {
    mockedFetch.restore();
  });

  it('should throw for unimplemented request()', async () => {
    await expect(
      new HttpApi({
        apiBase: '',
        externalOrigin: '',
        origin: '',
      }).request('GET', '/foo'),
    ).rejects.toThrow('Not Implemented');
  });

  it('should parse query string', async () => {
    const api = new TestHttpApi();

    expect(api.makePath('foo/1?bar=1', { baz: 'quz' })).toEqual(
      'foo/1?bar=1&baz=quz',
    );
  });

  it('should getExternalUrl', async () => {
    const api = new TestHttpApi();

    expect(api.getExternalUrl('foo/1', { bar: 1 })).toEqual(
      'https://example.com/v1/foo/1?bar=1',
    );
  });

  it('should cache gets', async () => {
    const api = new TestHttpApi();

    mockedFetch.get('https://gateway/v1/foo/1', { body: {}, status: 200 });

    await Promise.all([api.get('foo/1'), api.get('foo/1'), api.get('foo/1')]);

    expect(mockedFetch.calls('https://gateway/v1/foo/1')).toHaveLength(1);
  });

  it('should re throw get errors', async () => {
    const api = new TestHttpApi();

    mockedFetch.get('https://gateway/v1/foo/1', { body: '{}', status: 409 });

    await expect(api.get('foo/1')).rejects.toThrow(HttpError);
  });

  it('should create an arg loader', async () => {
    const api = new TestHttpApi();

    mockedFetch.get('https://gateway/v1/dressings?saladId=1', {
      body: { data: [{ saladId: '1' }, { saladId: '1' }] },
      status: 200,
    });

    const loader = api.createArgLoader('dressings', 'saladId');

    const [resultA, resultB] = await Promise.all([
      loader.load('1'),
      loader.load('1'),
    ]);

    expect(resultA).toEqual([{ saladId: '1' }, { saladId: '1' }]);
    expect(resultA === resultB).toEqual(true);
    expect(
      mockedFetch.calls('https://gateway/v1/dressings?saladId=1'),
    ).toHaveLength(1);
  });

  it('should create an arg loader that returns an empty set', async () => {
    const api = new TestHttpApi();

    mockedFetch.get('https://gateway/v1/dressings?saladId=1', {
      body: { data: null },
      status: 200,
    });

    const loader = api.createArgLoader('dressings', 'saladId');

    expect(await loader.load('1')).toEqual(null);
  });
});
