# Define names and associated functions for cacheable stats here...
# These processes are called at the end of process stats (run 
# typically on a nightly basis) and the results are stored in a file
# with the same name.
#
# These cacheable processes are designed to store data that can be
# plugged straight into a visualisation (e.g. some JSON that can be
# loaded in a world map visual), bypassing the need to make any big
# database queries that traditional IRStats2 can sometimes get caught
# up in and offering more flexibility for how stats are displayed

$c->{irstats2}->{cacheables} = {    
    "archive_count" => sub {
        my( $repo, $handler ) = @_;
 
        my $ctx = $handler->context( {
            datatype => "deposits",
            datafilter => "archive",
        } );
        return $handler->data( $ctx )->select()->sum_all();
    },
    "downloads_count" => sub {
        my( $repo, $handler ) = @_;
    
        my $ctx = $handler->context( {
            datatype => "downloads",
            datafilter => undef,
        } );
        return $handler->data( $ctx )->select()->sum_all();
    },
    "full_text_percentage" => sub {
        my( $repo, $handler ) = @_;
    
        my $ctx = $handler->context( {
            datatype => "doc_access",
            datafilter => "full_text",
        } );
        my $value1 = $handler->data( $ctx )->select()->sum_all();

        $ctx = $handler->context( {
            datatype => "deposits",
            datafilter => "archive",
        } );
        my $value2 = $handler->data( $ctx )->select()->sum_all();

        return ( defined $value1 && defined $value2 && $value1 > 0 && $value2 > 0 ) ? sprintf( "%.0f", ($value1 / $value2)*100 ): '0';
    },
    "open_access_percentage" => sub {
        my( $repo, $handler ) = @_;
 
        my $ctx = $handler->context( {
            datatype => "doc_access",
            datafilter => "open_access",
        } );
        my $value1 = $handler->data( $ctx )->select()->sum_all();

        $ctx = $handler->context( {
            datatype => "deposits",
            datafilter => "archive",
        } );
        my $value2 = $handler->data( $ctx )->select()->sum_all();

        return ( defined $value1 && defined $value2 && $value1 > 0 && $value2 > 0 ) ? sprintf( "%.0f", ($value1 / $value2)*100 ): '0';
   
    },
    eprint_downloads => sub {
     
        use JSON qw(encode_json decode_json);

        my( $repo, $handler ) = @_;
    
        my $ctx = $handler->context( {
            datatype => "downloads",
        } );

        my $data = $handler->data( $ctx )->select( top => 'eprint', fields => ['eprintid'] ); 

        my @results;
        foreach( @{$data->{data}} )
        {
            my $eprint = $repo->dataset( 'archive' )->dataobj( $_->{eprintid} );
            if( defined $eprint )
            {
                $_->{citation} = EPrints::Utils::tree_to_utf8( $eprint->render_citation( 'brief' ) );
                $_->{link} = $eprint->get_url;
                push @results, $_;
            }   
        }

        return encode_json \@results;
    },
    author_downloads => sub {
        use JSON qw(encode_json decode_json);
        my( $repo, $handler ) = @_;
        my $ctx = $handler->context( {
            datatype => "downloads",
            set_name => "authors",
        } );

        my $data = $handler->data( $ctx )->select( top => 'authors', fields => ['set_value'] ); 

        my @results;
        foreach( @{$data->{data}} )
        {
                my $name = EPrints::Utils::tree_to_utf8( $handler->sets->render_set( "authors", $_->{set_value} ) );
                $_->{set_value} = $name;
                push @results, $_;
        }

        return encode_json \@results;
    },
    monthly_downloads => sub {
        use JSON qw(encode_json decode_json);
        my( $repo, $handler ) = @_;
    
        my @results;
        my $avg_sum = 0;
        my $avg_n = 1;


        my $ctx = $handler->context( {
            datatype => "downloads",
        } );

        my $data = $handler->data( $ctx )->select( fields => ['datestamp'], order_by => 'datestamp', order_desc => 0 ); 
        my $from = $data->{data}->[0]->{datestamp};
        my $date_sections = EPrints::Plugin::Stats::Utils::get_dates( $from, undef, 'month' );

        # this builds in one pass: the data-points, the average data-points and the full-labels
        my $i = 0;
        my $month_labels = EPrints::Plugin::Stats::Utils::get_month_labels( $repo );
        foreach my $ds ( @$date_sections )
        {
            my $subtotal = 0;
            for( my $j=$i; $j < scalar(@{$data->data}); $j++ )
            {
                my $datapoint = $data->data->[$j] or last;

                if( $datapoint->{datestamp} =~ /^$ds/ )
                {
                    $subtotal += $datapoint->{count} || 0;
                    $i++;
                }
                else
                {
                   # safety measure - not to be stuck on the 1st data point (though this probably means something is wrong in Utils::get_dates

    #               commented out the following line: This line seem to cause stats discrepancies. https://github.com/eprints/irstats2/issues/69
    #                $i++ if( $i == 0 );

                    last;
                }
            }

            # 201201 => Jan 2012
            $ds =~ /^(\d{4})(\d{2})$/;
            my $desc = $month_labels->[$2-1]." $1";

            my $record = { count => $subtotal, datestamp => $ds, description => $desc };

            $avg_sum += $subtotal; # keep a sum of all the counts for potential future data clearing up, even if we don't need it to show an average
            $record->{average} = int( $avg_sum / $avg_n++ );
        

            push @results, $record;
        }
        return encode_json \@results;
    },
    country_downloads => sub {
        use JSON qw(encode_json decode_json);
        my( $repo, $handler ) = @_;
    
        my $ctx = $handler->context( {
            datatype => "countries",
        } );

        my $data = $handler->data( $ctx )->select( fields => [ 'value' ] ); 
        return encode_json $data->{data};
    },
};
