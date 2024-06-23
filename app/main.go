package main

import (
	"crypto/tls"
	"crypto/x509"
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	gorm_mysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type Product struct {
	gorm.Model
	Code  string
	Price uint
}

func main() {

	err := godotenv.Load()

	if err != nil {
		log.Fatal("Error loading .env file")
	}

	dsn := os.Getenv("DSN")

	rootCertPool := x509.NewCertPool()

	pem, err := os.ReadFile("global-bundle.pem")

	if err != nil {
		log.Fatalf("failed to read root cer, %v", err)
	}

	if ok := rootCertPool.AppendCertsFromPEM(pem); !ok {
		log.Fatal("failed to add root cert")
	}

	fmt.Println("cert loaded")

	tlsConfig := &tls.Config{
		RootCAs: rootCertPool,
	}

	err = mysql.RegisterTLSConfig("custom", tlsConfig)
	if err != nil {
		log.Fatalf("failed to register TLS config: %v", err)
	}

	// open DB connection with database/sql
	// using mysql
	sqlDB, err := sql.Open("mysql", dsn)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Connected to the database successfully")

	fmt.Println("sqlDB opened")

	// open gorm DB using the same connection
	db, err := gorm.Open(gorm_mysql.New(gorm_mysql.Config{
		Conn: sqlDB,
	}), &gorm.Config{})

	if err != nil {
		log.Fatal(err)
	}

	db.AutoMigrate(&Product{})

	// create product
	db.Create(&Product{Code: "D42", Price: 100})

	// // get product
	var product Product
	db.First(&product, "code = ?", "D42")

	fmt.Printf("Product found: %v \n", product)

}
