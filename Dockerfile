FROM node:14-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    JWT_SECRET="" \
    ADMIN_PASSWORD="" \
    DB_PASSWORD="" \
    AWS_ACCESS_KEY_ID="" \
    AWS_SECRET_ACCESS_KEY="" \
    STRIPE_API_KEY="" \
    INTERNAL_API_KEY=""

COPY . .

RUN npm install

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/config || exit 1


RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "app.js"]