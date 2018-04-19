/** @flow */

import { Response } from 'node-fetch';
import HttpError from '../src/api/HttpError';

describe('HttpError', () => {
  it('should add status', () => {
    const err = new HttpError(new Response(null, { status: 409 }));
    expect(err.status).toEqual(409);
  });

  it('should add api errors', async () => {
    const err = new HttpError(
      new Response(JSON.stringify({ errors: ['bar', 'baz'] }), {
        status: 409,
      }),
    );
    await err.init();
    expect(err.errors).toEqual(['bar', 'baz']);
  });

  it('should handle malformed responses', async () => {
    const err = new HttpError(
      new Response('{,}', {
        status: 409,
      }),
    );
    await err.init();
    expect(err.body).toEqual('{,}');
    expect(err.errors).toEqual([]);
  });
});
