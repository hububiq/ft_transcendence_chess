FROM postgres:15-alpine

# Copy the script physically inside the image. No bind mounts. Baking the file directly into PostgreSQL image
COPY init.sql /docker-entrypoint-initdb.d/init.sql