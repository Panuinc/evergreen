package security

import (
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

// ParseJWT parses and validates a JWT token against the provided JWK key set.
func ParseJWT(token []byte, keySet jwk.Set) (jwt.Token, error) {
	return jwt.Parse(token, jwt.WithKeySet(keySet))
}
