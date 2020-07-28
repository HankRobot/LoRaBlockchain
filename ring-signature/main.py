import os, hashlib, random
from functools import reduce
from Crypto.PublicKey import RSA

class Ring(object):
    """RSA implementation."""
    def __init__(self, k, L: int = 1024) -> None:
        self.k = k
        self.l = L
        self.n = len(list(k))
        self.q = 1 << (L - 1)

    def sign(self, m: str, z: int):
        """Sign a message."""
        self._permut(m)
        s = [None] * self.n
        u = random.randint(0, self.q)
        c = v = self._E(u)
        for i in list(range(z + 1, self.n)) + list(range(z)):
            s[i] = random.randint(0, self.q)
            e = self._g(s[i], self.k[i].e, self.k[i].n)
            v = self._E(v ^ e)
            if (i + 1) % self.n == 0:
                c = v
        s[z] = self._g(v ^ u, self.k[z].d, self.k[z].n)
        return [c] + s

    def verify(self, m: str, X) -> bool:
        """Verify a message."""
        self._permut(m)
        def _f(i):
            return self._g(X[i + 1], self.k[i].e, self.k[i].n)
        y = list(map(_f, range(len(X) - 1)))
        def _g(x, i):
            return self._E(x ^ y[i])
        r = reduce(_g, range(self.n), X[0])
        return r == X[0]

    def _permut(self, m):
        self.p = int(hashlib.sha1(str(m).encode('utf-8')).hexdigest(), 16)

    def _E(self, x):
        msg = '%s%s' % (x, self.p)
        return int(hashlib.sha1(str(msg).encode('utf-8')).hexdigest(), 16)

    def _g(self, x, e, n):
        q, r = divmod(x, n)
        if ((q + 1) * n) <= ((1 << self.l) - 1):
            result = q * n + pow(r, e, n)
        else:
            result = x
        return result

size = 4
msg1, msg2 = "hello", "world!"
msg3 = "Im fake"

def _rn(_):
    return RSA.generate(1024, os.urandom)

key = list(map(_rn, range(size)))
print("Key: "+ str(key))
r = Ring(key)
print("Ring signature: "+ str(r))

for i in range(size):
    s1 = r.sign(msg1, i)
    s2 = r.sign(msg2, i)

    if r.verify(msg1, s1) and r.verify(msg2, s2) and not r.verify(msg1, s2) and not r.verify(msg3, s2) and not r.verify(msg3, s1):
        print("Pass!")
    assert r.verify(msg1, s1) and r.verify(msg2, s2) and not r.verify(msg1, s2) and not r.verify(msg3, s2) and not r.verify(msg3, s1) 